import { DevicePhoneMobileIcon, EnvelopeIcon } from "@heroicons/react/20/solid";
import { Link, MetaFunction } from "@remix-run/react";
import Breadcrumbs from "~/components/breadcrumbs";
import Card from "~/components/card";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Login Method" },
  ];
};

export default function LoginIndex() {
  return (
    <>
      <Breadcrumbs items={[
        { to: "/login", label: "Login method selection" },
      ]} />

      <Card>
        <h1 className='text-slate-900 text-3xl font-semibold'>Choose a Verification Method</h1>

        <Link to="/login/sms" className="flex justify-center">
          <button
            type="button"
            className="inline-flex justify-between items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Continue using SMS
            <DevicePhoneMobileIcon aria-hidden="true" className="-mr-0.5 size-5" />
          </button>
        </Link>

        <hr className="mt-5 mb-5 border-slate-200" />

        <Link to="/login/email" className="flex justify-center">
          <button
            type="button"
            className="inline-flex justify-between items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Continue using Email
            <EnvelopeIcon aria-hidden="true" className="-mr-0.5 size-5" />
          </button>
        </Link>
      </Card>
    </>
  );
}

