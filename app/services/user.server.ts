import { Context } from "~/context";
import { Email, PhoneNumber } from "stytch";

interface GetCurrentUserInput {
  stytchUserId: string;
  userId: string;
}

interface GetCurrentUserOutput {
  id: string;
  stytch_user_id: string;
  emails: Email[];
  phoneNumbers: PhoneNumber[];
  status: string;
}

export async function getCurrentUser(ctx: Context, input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
  const [stytchUser, dbUser] = await Promise.all([
    ctx.stytch.users.get({ user_id: input.stytchUserId }),
    ctx.prisma.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: {
        id: true,
      },
    }),
  ]);

  return {
    id: dbUser.id,
    stytch_user_id: stytchUser.user_id,
    emails: stytchUser.emails,
    phoneNumbers: stytchUser.phone_numbers,
    status: stytchUser.status,
  };
}
