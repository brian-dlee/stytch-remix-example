import { ChevronRightIcon, HomeIcon } from "@heroicons/react/20/solid";
import { Link } from "@remix-run/react";

type PropsType = {
  items: { to: string, label: string }[],
}

export default function Breadcrumbs({ items }: PropsType) {
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex mb-10">
        <ol className="flex items-center space-x-4">
          <li>
            <div>
              <Link to={"/"} className="text-gray-400 hover:text-gray-500">
                <HomeIcon aria-hidden="true" className="size-5 shrink-0" />
                <span className="sr-only">Home</span>
              </Link>
            </div>
          </li>
          {items.length > 0 && (
            <>
              {items.slice(0, -1).map(({ to, label }, i) => (
                <li key={to}>
                  <div className="flex items-center">
                    <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                    <Link
                      aria-current={i === items.length - 1 ? 'page' : undefined}
                      to={to}
                      className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {label}
                    </Link>
                  </div>
                </li>
              ))}
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                  <span
                    aria-current='page'
                    className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    {items[items.length - 1].label}
                  </span>
                </div>
              </li>
            </>
          )}
        </ol>
      </nav>
    </div >
  )
}
