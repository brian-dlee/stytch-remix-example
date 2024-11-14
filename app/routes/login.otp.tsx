import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { LoaderFunctionArgs, redirect, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useForm, validationError } from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { clsx } from "clsx";
import { StytchError } from "stytch";
import { z } from "zod"
import Breadcrumbs from "~/components/breadcrumbs";
import Card from "~/components/card";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Verify OTP" }
  ];
};


interface LoaderData {
  methodId: string;
  methodName: string;
  userCreated: boolean;
  verificationTarget: string;
}

const requestSearchParamsDataSchema = z.object({
  methodId: z.string(),
  methodName: z.enum(['email', 'sms']),
  userCreated: z.enum(["1", "0"]),
  verificationTarget: z.string(),
})

export async function loader({ request }: LoaderFunctionArgs): Promise<LoaderData> {
  const requestUrl = new URL(request.url)

  const requestSearchParamsDataResult = await requestSearchParamsDataSchema.safeParseAsync(
    Object.fromEntries(
      requestUrl.searchParams.entries()
    )
  )
  if (!requestSearchParamsDataResult.success) {
    throw new Response('invalid OTP verification request', { status: 400 })
  }

  return {
    methodId: requestSearchParamsDataResult.data.methodId,
    methodName: requestSearchParamsDataResult.data.methodName,
    userCreated: requestSearchParamsDataResult.data.userCreated === '1',
    verificationTarget: requestSearchParamsDataResult.data.verificationTarget,
  }
}

const validator = withZod(
  z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    methodId: z.string(),
    userCreated: z.enum(['1', '0']),
  }),
)

export async function action({ context, request }: ActionFunctionArgs) {
  const data = await validator.validate(await request.formData());
  if (data.error) {
    return validationError(data.error)
  }

  const { code, methodId, userCreated } = data.data

  let authenticateResponse
  try {
    // 1. OTP Authenticate step; here we'll validate that the OTP + Method (phone_id or email_id) are valid and belong to
    // the same user who initiated the login flow.
    authenticateResponse = await context.stytch.otps.authenticate({
      code,
      method_id: methodId,
    });
  } catch (e) {
    context.pino.error({ methodId, e }, `Stytch OTP authentication failure: ${e}`)

    if (e instanceof StytchError) {
      throw new Response(`We were not able to login using the provided phone number: ${e.error_message}`, { status: 400 });
    } else {
      throw new Response(`We encountered a login failure: ${e}`, { status: 500 })
    }
  }

  // 2. Get the user from your Prisma database.
  //
  // Here you could also include any other business logic, e.g. firing logs in your own stack, on successful completion of the login flow.
  let dbUser
  try {
    dbUser = await context.prisma.user.findUniqueOrThrow({
      where: { stytchUserId: authenticateResponse.user.user_id },
      select: {
        id: true,
      },
    });
  } catch (e) {
    throw new Response(`An unexpected error occurred when retrieving the user account: ${e}`, { status: 500 })
  }

  // Examples of business logic you might want to include on successful user creation:
  //
  // Create a Stripe customer for the user.
  // await ctx.stripe.customers.create({ name: authenticateResponse.user.name.first_name });
  //
  // Subscribe the user to a mailing list.
  // await ctx.mailchimp.lists.addListMember("list_id", { email_address: authenticateResponse.user.emails[0].email, status: "subscribed" });

  // 3. Create the session for storage in the user's browser
  const session = await context.userSessionStorage.getSession()
  session.set("userId", dbUser.id)
  session.set("stytchUserId", authenticateResponse.user_id)

  const searchParams = new URLSearchParams()

  // The user_created flag is used to determine if the user was created during this login flow. This is useful for
  // determining if you should show a welcome message, or take some other action, for new vs. existing users.
  searchParams.append('userCreated', userCreated)

  return redirect("/profile?" + searchParams.toString(), {
    headers: {
      'Set-Cookie': await context.userSessionStorage.commitSession(session)
    }
  })
}

export default function LoginOtp() {
  const data = useLoaderData<LoaderData>();
  const form = useForm({
    method: "POST",
    validator,
    defaultValues: {
      code: '',
    },
  })

  return (
    <form {...form.getFormProps()}>
      <Breadcrumbs items={[
        { to: "/login", label: "Login method selection" },
        data.methodName === "email" ? { to: "/login/email", label: "Email" } : { to: "/login/sms", label: "SMS" },
        { to: "/login/otp", label: "Verify" },
      ]} />

      <input type="hidden" name="methodId" value={data.methodId} />
      <input type="hidden" name="userCreated" value={data.userCreated ? "1" : "0"} />

      <Card>
        <h1 className='text-slate-900 text-3xl font-semibold'>Verify your 6-Digit Code</h1>

        <p className='text-neutral-600'>
          A 6-digit verification was sent to <strong className='font-semibold'>{data.verificationTarget}</strong>
        </p>

        <div>
          <div className="flex relative mt-2 rounded-md shadow-sm">
            <input
              aria-label="6-Digit Code"
              aria-describedby="code-error"
              autoCapitalize='off'
              autoCorrect='off'
              inputMode='numeric'
              placeholder="6-Digit Code"
              spellCheck='false'
              type="text"
              className={clsx(
                "block w-full rounded-none rounded-l-md bg-white border-0 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm/6",
                form.error("code") === null ? 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600' : 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500',
              )}
              {...form.getInputProps("code")}
            />
            {form.error('code') && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ExclamationCircleIcon aria-hidden="true" className="size-5 text-red-500" />
              </div>
            )}
            <button
              type="submit"
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
            >
              <span className="sr-only">Verify</span>
              <CheckCircleIcon aria-hidden="true" className="-mr-0.5 size-5" />
            </button>
          </div>

          {form.error('code') && (
            <p id="code-error" className="mt-2 text-sm text-red-600">
              {form.error('code')}
            </p>
          )}
        </div>

        <Link to={`/login/${data.methodName}`} className='text-indigo-800 text-sm underline'>
          Resend your verification code
        </Link>

        <div className='text-xs text-gray-900'>
          By continuing, you agree to the <span className='underline'>Terms of Service</span> and acknowledge our{' '}
          <span className='underline'>Privacy Policy</span>.
        </div>
      </Card>
    </form>
  );
}
