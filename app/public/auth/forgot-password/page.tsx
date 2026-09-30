import { Suspense } from "react";
import ForgotPassword from "./ForgotPassword";

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ForgotPassword />
    </Suspense>
  );
}
