import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/20/solid";
import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Card from "~/components/card";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix+Stytch :: Home" },
  ];
};

export default function Index() {
  return (
    <Card>
      <h1 className='text-slate-900 text-3xl font-semibold'>Remix + Stytch</h1>

      <p className="leading-6 text-gray-800">
        This example app helps you understand how to use {' '}
        <Link
          className="text-indigo-700 underline"
          target="_blank"
          rel="noreferrer"
          to="https://stytch.com"
        >
          Stytch
        </Link>
        {' '} with {' '}
        <Link
          className="text-indigo-700 underline"
          target='_blank'
          rel="noreferrer"
          to='https://remix.run/'
        >
          Remix
        </Link>
        . You can use One-Time Passcodes, sent via email or SMS, to log in to this app and see the profile page.
      </p>

      <Link to="/login" className="flex justify-center">
        <button
          type="button"
          className="inline-flex justify-between items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Login
          <ArrowLeftEndOnRectangleIcon aria-hidden="true" className="-mr-0.5 size-5" />
        </button>
      </Link>
    </Card>
  );
}
