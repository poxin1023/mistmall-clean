export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  if (url.hostname === "meme-58a.pages.dev") {
    url.hostname = "shop.kissgood.co";
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
};
