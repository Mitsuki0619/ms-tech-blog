import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from '@remix-run/cloudflare'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { useEffect } from 'react'
import { z } from 'zod'

import { Textarea } from '~/components/ui/textarea'
import { getAuthenticator } from '~/services/auth/auth.server'
import { createPost } from '~/services/post/createPost.server'

import { loader as authLoader } from '../_index'

export const postCreateSchema = z.object({
  content: z
    .string({ required_error: 'Content is required' })
    .max(255, 'Content must be less than 255 characters'),
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.clone().formData()
  const submission = parseWithZod(formData, { schema: postCreateSchema })
  if (submission.status !== 'success') {
    return submission.reply()
  }
  const authenticator = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)
  if (!user) {
    return json(submission.reply())
  }
  await createPost(context, {
    content: String(formData.get('content')),
    authorId: user.id,
  })
  return json(submission.reply({ resetForm: true }))
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const posts = await context.db.post.findMany()
  return json({ posts })
}

export default function PostListPage() {
  const _ = useLoaderData<typeof authLoader>()
  const { posts } = useLoaderData<typeof loader>()

  const lastResult = useActionData<typeof action>()

  const [form, { content }] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: postCreateSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })

  useEffect(() => {
    if (form.status === 'success') {
      form.reset()
    }
  }, [form])

  return (
    <div>
      <h1>Posts</h1>
      <div>
        <ul>
          {posts.map((post) => (
            <li key={post.id}>{post.content}</li>
          ))}
        </ul>
      </div>
      <Form method="post" {...getFormProps(form)}>
        <div>
          <Textarea
            {...getInputProps(content, { type: 'text' })}
            key="content"
          />
          {content.errors && (
            <div>
              {content.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-500">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
        <button type="submit">Post</button>
      </Form>
    </div>
  )
}
