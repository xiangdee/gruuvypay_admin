export const isDev = process.env.NEXT_PUBLIC_ENVIRONMENT ? process.env.NEXT_PUBLIC_ENVIRONMENT=== 'development' : false


export const ApiLink =isDev ? (process.env.NEXT_PUBLIC_API_URL_DEV ) :
 (process.env.NEXT_PUBLIC_API_URL )
 

export const siteLink =isDev ? (process.env.NEXT_PUBLIC_SITE_URL_DEV ) :
 (process.env.NEXT_PUBLIC_SITE_URL )