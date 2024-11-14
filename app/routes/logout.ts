import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ context, request }: LoaderFunctionArgs): Promise<Response> {
  const session = await context.userSessionStorage.getSession(request.headers.get('Cookie'))

  return redirect('/', {
    headers: {
      'Set-Cookie': await context.userSessionStorage.destroySession(session),
    }
  })
}

export function action() {
  return new Response(null, { status: 405 })
}
