import { Post } from '@prisma/client/edge'
import { AppLoadContext } from '@remix-run/cloudflare'

export const createPost = async (
  context: AppLoadContext,
  data: Pick<Post, 'content' | 'authorId'>
) => {
  const { content, authorId } = data

  if (!content) {
    throw new Error('Invalid input')
  }
  const newPost = await context.db.post.create({
    data: { content, authorId },
  })
  return { id: newPost.id, content: newPost.content }
}
