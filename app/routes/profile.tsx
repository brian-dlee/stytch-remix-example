import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/20/solid";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, redirect, useLoaderData } from "@remix-run/react";
import { Email, PhoneNumber } from "stytch";
import Card from "~/components/card";
import DefaultFrame from "~/components/default-frame";
import { getCurrentUser } from "~/services/user.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Profile" },
  ];
};

interface LoaderData {
  user: {
    id: string;
    stytch_user_id: string;
    emails: Email[];
    phoneNumbers: PhoneNumber[];
    status: string;
  }
}

export async function loader({ context, request }: LoaderFunctionArgs): Promise<LoaderData> {
  const session = await context.userSessionStorage.getSession(request.headers.get("Cookie"))
  const userId = session.get("userId")
  const stytchUserId = session.get("stytchUserId")

  if (!userId || !stytchUserId) {
    throw redirect('/login')
  }

  context.pino.info({ userId, stytchUserId }, 'User is logged in')

  return {
    user: await getCurrentUser(context, { userId, stytchUserId })
  }
}

export default function Profile() {
  const { user } = useLoaderData<LoaderData>()

  return (
    <Card>
      <h1 className='text-slate-900 text-3xl font-semibold'>User Profile</h1>

      <pre className='text-slate-800 code-block text-left text-xs'>
        <code>{JSON.stringify(user, null, 2)}</code>
      </pre>

      <Link to="/logout" className="flex justify-center">
        <button
          type="button"
          className="inline-flex justify-between items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Logout
          <ArrowLeftStartOnRectangleIcon aria-hidden="true" className="-mr-0.5 size-5" />
        </button>
      </Link>
    </Card>
  );
}
