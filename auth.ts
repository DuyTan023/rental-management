import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Phương thức đăng nhập bằng thông tin do người dùng tự nhập (email - password)
    Credentials({
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        // Nếu email và password không có trẻ vầ null
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email);
        const pasword = String(credentials.password);

        // Lấu user trong database theo email
        const user = await prisma.users.findUnique({
          where: {
            email,
          },
        });

        //Nếu ko tìm thấy user thì trả về null
        if (!user) {
          return null;
        }

        // Nếu user chưa có pass thì trả về null
        if (!user.password_hash) {
          return null;
        }

        //Hàm kiểm tra password nhập vào có giống với password_hash không(đã mã hóa)
        const isPasswordValid = await bcrypt.compare(
          pasword,
          user.password_hash,
        );

        //Nếu kết quả kiểm tra password là sai thì về null
        if (!isPasswordValid) {
          return null;
        }

        // Cập nhật thời gian đăng nhập lần cuối
        await prisma.users.update({
          where: {
            id: user.id,
          },
          data: {
            last_login_at: new Date(),
          },
        });

        //Kết quả trả về 1 object (id, email, role)
        return {
          id: user.id.toString(),
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    // Không có mailk là do mail đã được tự đỗngử lý còn id và role là custom nên cần làm thủ công

    // copy user trả về vào token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    // Coppy token vào session để dùng sau này
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;

      return session;
    },
  },
});
