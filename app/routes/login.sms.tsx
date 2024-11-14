import { ExclamationCircleIcon, PaperAirplaneIcon } from "@heroicons/react/20/solid";
import { redirect, type ActionFunctionArgs, type MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useForm, validationError } from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { clsx } from "clsx";
import { CountryCode, parsePhoneNumber } from "libphonenumber-js/min";
import { StytchError } from "stytch";
import { z } from "zod"
import Breadcrumbs from "~/components/breadcrumbs";
import Card from "~/components/card";
import { STYTCH_SUPPORTED_SMS_COUNTRIES } from "~/utils/phone-countries";
import { VALID_PHONE_NUMBER } from "~/utils/regex";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Login via SMS" }
  ];
};

const validator = withZod(
  z.object({
    country: z.string().regex(/^[A-Z]{2}$/, 'Invalid country code'),
    phone: z.string().regex(VALID_PHONE_NUMBER, 'Invalid phone number').min(1, 'Phone number is required'),
  })
)

export async function action({ context, request }: ActionFunctionArgs) {
  const data = await validator.validate(await request.formData());
  if (data.error) {
    return validationError(data.error)
  }

  const { country, phone } = data.data

  if (!STYTCH_SUPPORTED_SMS_COUNTRIES.includes(country)) {
    throw new Response(`Sorry, we don't support sms login for your country yet.`, { status: 400 })
  }

  const phoneNumber = parsePhoneNumber(phone, { defaultCountry: country as CountryCode });

  if (!phoneNumber?.country || phoneNumber.country !== country) {
    throw new Response(`The phone number you provided does not match the country code you selected.`, { status: 400 })
  }

  const formattedPhoneNumber = phoneNumber.format('E.164')

  let loginOrCreateResponse
  try {
    // 1. Login or create the user in Stytch. If the user has been seen before, a vanilla login will be performed, if they
    // haven't been seen before, an SMS will be sent and a new Stytch User will be created.
    loginOrCreateResponse = await context.stytch.otps.sms.loginOrCreate({
      phone_number: formattedPhoneNumber,
      create_user_as_pending: true,
    });
  } catch (e) {
    if (e instanceof StytchError) {
      throw new Response(`We were not able to login using the provided phone number: ${e.error_message}`, { status: 400 });
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

  searchParams.append('methodName', 'sms')

  // The method_id is used during the OTP Authenticate step to ensure the OTP code belongs to the user who initiated the
  // the login flow.
  searchParams.append('methodId', loginOrCreateResponse.phone_id)

  // The user_created flag is used to determine if the user was created during this login flow. This is useful for
  // determining if you should show a welcome message, or take some other action, for new vs. existing users.
  searchParams.append('userCreated', loginOrCreateResponse.user_created ? '1' : '0')

  searchParams.append('verificationTarget', formattedPhoneNumber)

  return redirect('/login/otp?' + searchParams.toString())
}

export default function LoginSms() {
  const form = useForm({
    method: "POST",
    validator,
    defaultValues: {
      phone: '',
    },
  })

  return (
    <form {...form.getFormProps()}>
      <Breadcrumbs items={[
        { to: "/login", label: "Login method selection" },
        { to: "/login/sms", label: "SMS" },
      ]} />

      <Card>
        <h1 className='text-slate-900 text-3xl font-semibold'>Login using SMS Verification</h1>

        <div>
          <div className="flex relative mt-2 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 flex items-center">
              <label htmlFor="country" className="sr-only">
                Country
              </label>
              <select
                autoComplete="country"
                id="country"
                name="country"
                className="h-full rounded-md border-0 bg-transparent py-0 pl-3 pr-7 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
              >
                <option>US</option>
                <option>CA</option>
              </select>
            </div>
            <input
              aria-label="Phone Number"
              aria-describedby="phone-error"
              autoCapitalize='off'
              autoCorrect='off'
              inputMode='tel'
              spellCheck='false'
              placeholder="(555) 987-6543"
              type='phone'
              className={clsx(
                "block w-full rounded-none rounded-l-md bg-white border-0 py-1.5 pl-16 text-gray-900 ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm/6",
                form.error("phone") === null ? 'text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-indigo-600' : 'text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-red-500',
              )}
              {...form.getInputProps("phone")}
            />
            {form.error('phone') && (
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

          {form.error('phone') && (
            <p id="phone-error" className="mt-2 text-sm text-red-600">
              {form.error('phone')}
            </p>
          )}

        </div>

        <Link to="/login/email" className='text-indigo-800 text-sm underline'>
          Or switch from SMS to email
        </Link>

        <div className='text-xs text-gray-900'>
          By continuing, you agree to the <span className='underline'>Terms of Service</span> and acknowledge our{' '}
          <span className='underline'>Privacy Policy</span>.
        </div>
      </Card>
    </form>
  );
}

