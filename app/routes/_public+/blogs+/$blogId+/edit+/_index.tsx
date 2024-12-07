import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
} from '@remix-run/cloudflare'
import { useActionData, useLoaderData } from '@remix-run/react'
import { jsonWithError, jsonWithSuccess, redirectWithError } from 'remix-toast'
import { z } from 'zod'
import { zx } from 'zodix'

import { BlogEditor } from '~/features/blogs/BlogEditor'
import { getAuthenticator } from '~/services/auth/auth.server'
import { getBlog } from '~/services/blog/getBlog.server'
import { getCategories } from '~/services/blog/getCategories.server'
import { updateBlog } from '~/services/blog/updateBlog.server'

const patchBlogSchema = z.object({
  title: z.string({ required_error: 'Title is required' }),
  categories: z.array(z.string()),
  content: z.string({ required_error: 'Content is required' }),
  published: z.boolean().default(false),
})

export const loader = async ({
  context,
  request,
  params,
}: LoaderFunctionArgs) => {
  const { authenticator } = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)
  if (!user) {
    return redirectWithError('/', {
      message: 'You must be signed in to edit a blog',
    })
  }
  const categories = await getCategories(context)
  const categoriesOptions = categories.map((category) => ({
    value: category.id.toString(),
    label: category.name,
  }))
  const { blogId } = zx.parseParams(params, {
    blogId: z.preprocess((v) => Number(v), z.number()),
  })
  const blog = await getBlog(context, blogId, user.id)
  return json({ categoriesOptions, blog })
}

export const action = async ({
  context,
  request,
  params,
}: ActionFunctionArgs) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: patchBlogSchema })
  const { authenticator } = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)
  const { blogId } = zx.parseParams(params, {
    blogId: z.preprocess((v) => Number(v), z.number()),
  })
  if (!user) {
    return jsonWithError(
      { result: submission.reply() },
      {
        message: 'You must be signed in to edit a blog',
      }
    )
  }
  if (submission.status !== 'success') {
    return json({ result: submission.reply() })
  }
  await updateBlog(context, {
    id: blogId,
    title: String(formData.get('title')),
    categories: formData.getAll('categories').map(Number),
    content: String(formData.get('content')),
    published: Boolean(formData.get('published')),
    userId: user.id,
  })
  return jsonWithSuccess(
    { result: submission.reply() },
    {
      message: 'Blog updated successfully',
      description: 'Your blog has been updated successfully',
    }
  )
}

export default function Index() {
  const { categoriesOptions, blog } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    lastResult: actionData?.result,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: patchBlogSchema })
    },
    defaultValue: {
      title: blog.title,
      content: blog.content,
      categories: blog.categories.map((category) => category.id.toString()),
      published: blog.published,
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  return (
    <>
      <BlogEditor
        type="edit"
        title={fields.title}
        content={fields.content}
        categories={fields.categories}
        published={fields.published}
        categoriesOptions={categoriesOptions}
        form={form}
        key={form.key}
      />
    </>
  )
}
