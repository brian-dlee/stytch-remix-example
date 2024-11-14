import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const session = await context.userSessionStorage.getSession(request.headers.get('Cookie'))
  const userId = session.get('userId')

  if (userId) {
    return redirect('/profile')
  }

  return null
}

