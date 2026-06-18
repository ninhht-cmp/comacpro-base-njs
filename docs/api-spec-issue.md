# [API/Swagger] Đặt tên schema để giảm trùng lặp trong OpenAPI spec & sửa lệch envelope

## TL;DR

OpenAPI spec hiện sinh rất nhiều schema **inline ẩn danh** trùng nhau → client
generate ra (orval) bị phình ~156 type, trong đó ~60% là bản sao cơ học của một
nhúm khái niệm. Đề xuất đặt tên enum (`enumName`) + dùng DTO/generic dùng chung.
Kèm theo: spec khai báo envelope `BaseResDto` nhưng runtime trả raw — cần thống nhất.

## Bối cảnh

FE sinh typed client + hooks + zod từ spec (`/apidoc-json`) bằng orval. Vì spec
định nghĩa schema inline thay vì component có tên, mỗi operation lại sinh một type
riêng dù nội dung **giống hệt**.

## Bằng chứng (đo trên spec hiện tại)

Tổng **156** file model, trong đó:

| Nhóm              | Số lượng | Nội dung                                         |
| ----------------- | -------- | ------------------------------------------------ |
| `*Order`          | 10       | **Toàn bộ giống hệt** `{ asc, desc }`            |
| `*Status`         | 25       | Phần lớn lặp `{ 0, 1 }`                          |
| `*AdditionalData` | 9        | **Toàn bộ giống hệt** `{ [k]: unknown } \| null` |
| `*Params`         | 11       | Query params inline theo từng operation          |
| `*…200`           | 50       | Wrapper response inline theo từng operation      |

Ví dụ — hai type này khác nhau **chỉ ở tên**, sinh ra 2 file:

```ts
// bannerControllerGetListOrder.ts
export const BannerControllerGetListOrder = {
  asc: 'asc',
  desc: 'desc',
} as const;
// categoryControllerGetListOrder.ts
export const CategoryControllerGetListOrder = {
  asc: 'asc',
  desc: 'desc',
} as const;
// …×10
```

## Tác động

- Spec phình to, client generate khó đọc, git diff nhiễu mỗi lần regen.
- Ảnh hưởng **mọi consumer** của spec (web, mobile, service khác), không riêng FE.
- Khó tái sử dụng kiểu chung (vd "sort order") vì mỗi endpoint là một type khác nhau.

## Nguyên nhân

NestJS Swagger emit schema **inline (ẩn danh)** khi enum/object không được đặt tên.
Generator không thể tự gộp các schema trùng cấu trúc → mỗi inline schema thành một type.

## Đề xuất sửa (backend)

### 1. Enum → đặt tên bằng `enumName` (để emit thành `$ref` component dùng chung)

```ts
// ❌ Hiện tại: inline → mỗi operation 1 enum trùng
@ApiPropertyOptional({ enum: ['asc', 'desc'] })
order?: 'asc' | 'desc';

// ✅ Sửa: enum có tên → 1 component `SortOrder` dùng lại khắp nơi
export enum SortOrder { ASC = 'asc', DESC = 'desc' }

@ApiPropertyOptional({ enum: SortOrder, enumName: 'SortOrder' }) // enumName là chìa khóa
order?: SortOrder;
```

Áp dụng tương tự cho các `*Status` (tách `UserStatus`, `BannerStatus`,
`CategoryStatus`… có tên, thay vì lặp `{0,1}` inline).

### 2. `additionalData` → 1 DTO có tên thay vì inline 9 lần

```ts
export class AdditionalDataDto {
  [key: string]: unknown;
}
```

### 3. Envelope & pagination → generic dùng chung (`@ApiExtraModels` + `getSchemaPath`)

Gom 50 wrapper `*…200` về một kiểu generic thay vì inline từng operation:

```ts
export class BaseResDto<T> {
  success: boolean;
  statusCode: number;
  messages?: string[];
  data: T;
}

export class PaginatedResDto<T> {
  meta: MetaDataDto; // đã là shared ref ✅
  data: T[];
  additionalData?: AdditionalDataDto | null;
}

// Helper decorator để Swagger hiểu generic
export const ApiOkBase = <T extends Type>(model: T) =>
  applyDecorators(
    ApiExtraModels(BaseResDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(BaseResDto) },
          { properties: { data: { $ref: getSchemaPath(model) } } },
        ],
      },
    }),
  );

// dùng:
@ApiOkBase(UserResDto)
@Get('me')
getMyProfile() { /* … */ }
```

## ⚠️ Liên quan: spec không khớp runtime (envelope)

Spec khai báo các response auth là `BaseResDto & { data: … }`, **nhưng endpoint
thật trả payload raw ở top-level**. Đã verify trên backend đang chạy:

```
POST /api/v1/auth/signin   → { accessToken, refreshToken, expiresIn }   // KHÔNG có { data }
GET  /api/v1/users/me      → { id, username, email, … }                 // KHÔNG có { data }
lỗi                        → { message, error, statusCode }             // NestJS default, không phải envelope
```

Trong khi các endpoint list (`*GetList`) lại trả `{ meta, data[], additionalData }`.

→ Hệ quả: client generate type `{ data?: T }` nhưng truy cập `.data` lúc runtime là
`undefined`; FE phải bypass client để gọi raw. **Cần thống nhất**: hoặc tất cả
response bọc `BaseResDto`, hoặc spec phản ánh đúng dạng raw. (Hiện tại spec đang
"nói dối" so với implementation.)

> Phụ: response `GET /users/me` đang trả về cả field `password` (hash). Nên loại
> field này khỏi DTO response.

## Acceptance criteria

- [ ] Các enum lặp (`order`, `status`, …) trở thành component `$ref` có tên; không
      còn `*Order`/`*Status` trùng theo operation.
- [ ] `additionalData` là DTO có tên.
- [ ] Response thống nhất một envelope (hoặc spec phản ánh đúng raw), khớp giữa spec
      và runtime.
- [ ] `GET /users/me` không trả `password`.
- [ ] Regen client từ spec mới: số schema giảm rõ rệt (kỳ vọng 156 → ~80–90), build
      FE vẫn xanh.
