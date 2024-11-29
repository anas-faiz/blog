import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { Variables } from "hono/types";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
    
  };
}>();


blogRouter.use("/*", async (c, next) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const authheader = c.req.header("Authorization") || "";
  const token = authheader.replace("Bearer", "").trim();
  const user = await verify(token, c.env.JWT_SECRET);

  if (user) {
    c.set('userId', 'user.id' )
    await next();
  } else {
    c.status(403);
    return c.json({
      message: "You are not authorized",
    });
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());


  const authorId = c.get("userId");
  const body = await c.req.json();
  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content,
		
      authorId: Number(authorId),
    },
  });
  return c.json({ id: post.id });
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());


  const userId = c.get("userId");
  const body = await c.req.json();
  await prisma.post.update({
    where: {
      id: body.id,
      
    },
    data: {
      title: body.title,
      content: body.content,
    },
  });
  return c.text("Updated post");
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());


  const id = c.req.param("id");
  const post = await prisma.post.findUnique({
    where: {
      id: id,
    },
  });
  return c.json(post);
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const posts = await prisma.post.findMany();
  return c.json(posts);
});
