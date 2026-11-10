
import { NextResponse } from "next/server";

export function assetSuccess(
  message: string,
  data: unknown,
  status = 200
) {
  const serialized = JSON.parse(
    JSON.stringify(data, (_, value) =>
      typeof value === "bigint"
        ? value.toString()
        : value
    )
  );

  return NextResponse.json(
    {
      success: true,
      message,
      data: serialized,
    },
    { status }
  );
}

export function assetError(
  message: string,
  status = 500,
  code = "SERVER_ERROR"
) {
  return NextResponse.json(
    {
      success: false,
      message,
      code,
    },
    { status }
  );
}

export function handleAssetError(
  error: unknown,
  DomainError: new (...args: never[]) => Error
) {
  if (error instanceof DomainError) {
    const domainError = error as Error & {
      status: number;
      code: string;
    };

    return assetError(
      domainError.message,
      domainError.status,
      domainError.code
    );
  }

  console.error("[ASSET API ERROR]", error);

  return assetError(
    "Đã xảy ra lỗi hệ thống",
    500,
    "SERVER_ERROR"
  );
}

export function parseAssetId(id: string): bigint | null {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  try {
    return BigInt(id);
  } catch {
    return null;
  }
}
