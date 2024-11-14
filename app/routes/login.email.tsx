import { ExclamationCircleIcon, PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { redirect, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useForm, validationError } from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { clsx } from "clsx";
import { StytchError } from "stytch";
import { z } from "zod"
import Breadcrumbs from "~/components/breadcrumbs";
import Card from "~/components/card";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Login via Email" },
  ];
};

const validator = withZod(
  z.object({
    email: z.string().email('Invalid email address').min(1, 'Email address is required'),
  })
)

export async function action({ context, request }: ActionFunctionArgs) {
  const data = await validator.validate(await request.formData());
  if (data.error) {
    return validationError(data.error)
  }

  const { email } = data.data

  let loginOrCreateResponse
  try {
    // 1. Login or create the user in Stytch. If the user has been seen before, a vanilla login will be performed, if they
    // haven't been seen before, an SMS will be sent and a new Stytch User will be created.
    loginOrCreateResponse = await context.stytch.otps.email.loginOrCreate({
      email,
      create_user_as_pending: true,
    });
  } catch (e) {
    if (e instanceof StytchError) {
      throw new Response(`We were not able to login using the provided email address: ${e.error_message}`, { status: 400 });
    } else {
      throw new Response(`We encountered a login failure: ${e}`, { status: 500 })
    }
  }

  // 2. Create the user in your Prisma database.
  //
  // Because Stytch auth lives in your backend, you can perform all of your
  // normal business logic in sync with your authentication, e.g. syncing your user DB, adding the user to a mailing list,
  // or provisioning them a Stripe customer, etc.
  //
  // If you're coming from Auth0, you might have Rules, Hooks, or Actions that perform this logic. With Stytch, there is
  // no need for this logic to live outside of your codebase separate from your backend.
  try {
    const user = await context.prisma.user.findFirst({ where: { stytchUserId: loginOrCreateResponse.user_id } })
    if (!user) {
      await context.prisma.user.create({ data: { stytchUserId: loginOrCreateResponse.user_id } });
    }
  } catch (e) {
    throw new Response(`An unexpected error occurred when creating the new user account: ${e}`, { status: 500 })
  }

  const searchParams = new URLSearchParams()

  searchParams.append('methodName', 'email')

  // The method_id is used during the OTP Authenticate step to ensure the OTP code belongs to the user who initiated the
  // the login flow.
  searchParams.append('methodId', loginOrCreateResponse.email_id)

  // The user_created flag is used to determine if the user was created during this login flow. This is useful for
  // determining if you should show a welcome message, or take some other action, for new vs. existing users.
  searchParams.append('userCreated', loginOrCreateResponse.user_created ? '1' : '0')

  searchParams.append('verificationTarget', email)

  return redirect('/login/otp?' + searchParams.toString())
}

export default function Index() {
  const form = useForm({
    method: "POST",
    validator,
    defaultValues: {
      email: '',
    },
  })

  return (
    <form {...form.getFormProps()}>
      <Breadcrumbs items={[
        { to: "/login", label: "Login method selection" },
        { to: "/login/email", label: "Email" },
      ]} />

      <Card>
        <h1 className='text-slate-900 text-3xl font-semibold'>Login using SMS Verification</h1>

        <div>
          <div className="flex relative mt-2 rounded-md shadow-sm">
            <input
              aria-label="Email Address"
              aria-describedby="email-error"
              autoCapitalize='off'
              autoCorrect='off'
              inputMode='email'
              placeholder="example@email.com"
              spellCheck='false'
              type='email'
              className={clsx(
                "block w-full rounded-none rounded-l-md bg-white border-0 py-1.5 text-gray-900 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm/6",
                form.error("email") === null ? 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600' : 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500',
              )}
              {...form.getInputProps("email")}
            />
            {form.error('email') && (
              <div className="pointer-events-none absolute inset-y-0 right-6 flex items-center pr-6">
                <ExclamationCircleIcon aria-hidden="true" className="size-5 text-red-500" />
              </div>
            )}
            <button
              type="submit"
              className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
            >
              <span className="sr-only">Send</span>
              <PaperAirplaneIcon aria-hidden="true" className="-mr-0.5 size-5" />
            </button>
          </div>

          {form.error('email') && (
            <p id="email-error" className="mt-2 text-sm text-red-600">
              {form.error('email')}
            </p>
          )}
        </div>

        <Link to="/login/sms" className='text-indigo-800 text-sm underline'>
          Or switch from email to SMS
        </Link>

        <div className='text-xs text-gray-900'>
          By continuing, you agree to the <span className='underline'>Terms of Service</span> and acknowledge our{' '}
          <span className='underline'>Privacy Policy</span>.
        </div>
      </Card>
    </form>
  );
}

