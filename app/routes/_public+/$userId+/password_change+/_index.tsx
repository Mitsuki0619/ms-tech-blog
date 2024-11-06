import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { ActionFunctionArgs } from '@remix-run/cloudflare'
import {
  ClientActionFunctionArgs,
  Form,
  json,
  useActionData,
  useNavigation,
} from '@remix-run/react'
import { z } from 'zod'

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
import { toast } from '~/hooks/use-toast'
import { getAuthenticator } from '~/services/auth/auth.server'
import { updatePassword } from '~/services/password_change/updatePassword.server'

const passwordChangeSchema = z
  .object({
    currentPassword: z.string({
      required_error: 'Current password is required',
    }),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(255, 'Password must be less than 255 characters')
      .refine(
        (password) => /[A-Za-z]/.test(password) && /[0-9]/.test(password),
        'Password must contain at least one letter and one number'
      ),
    confirmNewPassword: z.string({
      required_error: 'Please confirm your new password',
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  })

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { authenticator } = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)
  const formData = await request.clone().formData()
  const submission = parseWithZod(formData, { schema: passwordChangeSchema })
  if (submission.status !== 'success') {
    return submission.reply()
  }
  if (!user) {
    return json(
      submission.reply({
        fieldErrors: {
          currentPassword: ['You must be signed in to change your password'],
        },
      })
    )
  }
  const { currentPassword, newPassword } = submission.value
  try {
    await updatePassword(context, {
      userId: user.id,
      currentPassword,
      newPassword,
    })
    return json(submission.reply({ resetForm: true }))
  } catch (error) {
    return json(
      submission.reply({
        fieldErrors: {
          currentPassword: ['Current password is incorrect'],
        },
      })
    )
  }
}

export async function clientAction({ serverAction }: ClientActionFunctionArgs) {
  const data = await serverAction<typeof action>()
  if (data.status === 'error') return data
  toast({ title: 'Success', description: 'User created!' })
  return null
}

export default function Index() {
  const lastResult = useActionData<typeof action>()
  const navigation = useNavigation()
  const [form, { currentPassword, newPassword, confirmNewPassword }] = useForm({
    lastResult,
    defaultValue: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: passwordChangeSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  return (
    <div className="w-full flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
          <CardDescription>
            Enter your current password and a new password to update your
            account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            method="post"
            action="#"
            {...getFormProps(form)}
            className="space-y-4"
          >
            <div>
              <Label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Current Password
              </Label>
              <Input
                {...getInputProps(currentPassword, { type: 'password' })}
                className="mt-1"
                autoComplete="current-password"
              />
              {currentPassword.errors?.map((error, index) => (
                <p className="mt-1 text-sm text-red-600" key={index}>
                  {error}
                </p>
              ))}
            </div>
            <div>
              <Label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </Label>
              <Input
                {...getInputProps(newPassword, { type: 'password' })}
                autoComplete="new-password"
                className="mt-1"
              />
              {newPassword.errors?.map((error, index) => (
                <p className="mt-1 text-sm text-red-600" key={index}>
                  {error}
                </p>
              ))}
              <p className="mt-1 text-sm text-gray-500">
                Password must be at least 8 characters and contain at least one
                letter and one number.
              </p>
            </div>
            <div>
              <Label
                htmlFor="confirmNewPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </Label>
              <Input
                {...getInputProps(confirmNewPassword, { type: 'password' })}
                autoComplete="new-password"
                className="mt-1"
              />
              {confirmNewPassword.errors?.map((error, index) => (
                <p className="mt-1 text-sm text-red-600" key={index}>
                  {error}
                </p>
              ))}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={navigation.state === 'submitting'}
            >
              {navigation.state === 'submitting'
                ? 'Changing Password...'
                : 'Change Password'}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
