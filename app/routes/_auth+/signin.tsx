import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  json,
} from '@remix-run/cloudflare'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'

import { Icons } from '~/components/icons'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { getAuthenticator } from '~/services/auth/auth.server'

const signInSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be less than 255 characters')
    .refine(
      (password) => /[A-Za-z]/.test(password) && /[0-9]/.test(password),
      'Password must contain at least one letter and one number'
    ),
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.clone().formData()
  const submission = parseWithZod(formData, { schema: signInSchema })
  if (submission.status !== 'success') {
    return json(submission.reply())
  }
  const authenticator = getAuthenticator(context)
  return await authenticator
    .authenticate('user-pass', request, {
      successRedirect: '/',
    })
    .catch((e) => {
      if (e instanceof Response && e.status === 302) {
        return json(submission.reply(), e)
      }
      return json(
        submission.reply({
          fieldErrors: {
            email: ['Invalid email or password'],
          },
        }),
        { status: 401 }
      )
    })
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const authenticator = getAuthenticator(context)
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/',
  })
}

export const SignInPage: React.FC = () => {
  const lastResult = useActionData<typeof action>()
  const [form, { email, password }] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: signInSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="grid place-content-center ">
      <div className="mt-40">
        <Card className="w-[400px]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Form action="/google" method="post">
                <Button variant="outline" className="w-full">
                  <Icons.google className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </Form>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Form method="post" {...getFormProps(form)}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  {...getInputProps(email, { type: 'email' })}
                  placeholder="m@example.com"
                />
                {email.errors && (
                  <div>
                    {email.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-500">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input {...getInputProps(password, { type: 'password' })} />
                {password.errors && (
                  <div>
                    {password.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-500">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              <Button type="submit" name="_action" className="w-full">
                Sign in
              </Button>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default SignInPage
