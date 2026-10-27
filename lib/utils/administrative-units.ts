export type Ward = {
  code: number;
  name: string;
  codename: string;
  division_type: string;
};

export type Province = {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
  wards: Ward[];
};

const BASE_URL = "https://provinces.open-api.vn/api/v2";

// Lấy danh sách tỉnh/thành phố
export async function getProvinces(): Promise<Province[]> {
  const response = await fetch(`${BASE_URL}/?depth=1`);

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách tỉnh/thành phố");
  }

  return response.json();
}

// Lấy thông tin tỉnh/thành và danh sách phường/xã trực thuộc
export async function getWards(provinceCode: number): Promise<Ward[]> {
  const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách phường/xã");
  }

  const province: Province = await response.json();

  return province.wards ?? [];
}
