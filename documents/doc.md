This tutorial is based on this NextJS guide at Supabase.com. Because it's very brief steps, I am filling in the instructions here. Also this tutorial will orientate you to Supabase's dashboard too:
https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

## Signup Supabase

Sign up free [https://supabase.com/](https://supabase.com/)
Can OAuth with your github account

![Placeholder](https://place-hold.it/400x300)

---

## Create Database,  Table, and Authentication Policies at Supabase

### Create Database

Create new project
https://supabase.com/dashboard/new

It may ask for a password for a dedicated Postgres database for your project (Supabase is a wrapper of Postgres)

![Placeholder](https://place-hold.it/400x300)

---

### Create Table

Create some table:

1. Open SQL Editor:

![Placeholder](https://place-hold.it/400x300)

2. Run the query at SQL Editor to create users table:
```
-- Create the table  
create table users (  
  id bigint primary key generated always as identity,  
  name varchar(255) not null,  
  email text not null,  
  password text not null  
);  
  
-- Insert some sample data into the table  
insert into users (name, email, password)  
values  
  ('User', 'user@nextmail.com', '$2b$10$6zwuNPLNFvggBKutcXg08uWIwzOEU4jFKA68Fdl.LmVyZUJez0u06');  
  
-- Enable Row Level Security  
alter table users enable row level security;
```

3. Click "Run" at the bottom right

![Placeholder](https://place-hold.it/400x300)


Confirm the table is created:
1. Open Database section

![Placeholder](https://place-hold.it/400x300)

2. Open Tables:

![Placeholder](https://place-hold.it/400x300)

3. You’ll see:

![Placeholder](https://place-hold.it/400x300)

4. Orientation to Supabase Tables: Go to Edit Table

![Placeholder](https://place-hold.it/400x300)

It’ll tell you that Row Level Security (RSL) is enabled and that: “You need to create an access policy before you can query data from this table. Without a policy, querying this table will return an empty array of results.” Here is also where you can change the columns.

5. Orientation to Supabase Tables: To see your rows:

![Placeholder](https://place-hold.it/400x300)

![Placeholder](https://place-hold.it/400x300)

---

### Create Auth Policies

6. We need to add policies. Go back to SQL Editor and run (otherwise will always return 0 rows)
	- Notice table name repeated twice
```
create policy "public can read users"  
on public.users  
for select to anon  
using (true);
```

7. Go to List Policies. You can access policies either under Databases or Authentication

A:

![Placeholder](https://place-hold.it/400x300)

or B:

![Placeholder](https://place-hold.it/400x300)

Regardless, the Policies list look like:

![Placeholder](https://place-hold.it/400x300)

Orientation:
If you click Create Policy:

![Placeholder](https://place-hold.it/400x300)

Then there would be a policy query generator (this is an alternative to the SQL Editor to create a policy):

![Placeholder](https://place-hold.it/400x300)

---

## Local Development

### Start new or add to existing

If starting new nextjs project:
```
npx create-next-app -e with-supabase
```
^ There will be sign in and signup which incorporates with Supabase Authentication. We will ignore these features because those will be a future challenge. We are only focusing on Supabase databases for this tutorial.

Otherwise you install these packages on the existing NextJS project:
```
"name": "@supabase/supabase-js",
"version": "2.49.1",
"description": "Isomorphic Javascript client for Supabase",

"name": "@supabase/ssr",
"version": "0.5.2",
"description": "Use the Supabase JavaScript library in popular server-side rendering (SSR) frameworks.",

"name": "bcrypt",
"version": "5.1.1",
"description": "A bcrypt library for NodeJS.",

```

For NextJS version that these instructions are for:
```
"name": "next",
"version": "15.2.2",
```

### Setup env variables

Get the supabase url and anon key from Supabase. Either way can

A:

![Placeholder](https://place-hold.it/400x300)

Or B:

![Placeholder](https://place-hold.it/400x300)

... then

![Placeholder](https://place-hold.it/400x300)

Copy those variables to an `.env` file:
```
NEXT_PUBLIC_SUPABASE_URL=<Your_Supabase_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=Your_Supabase_Anon_Key>
```

---

## Create Pages

Create Supabase server client at  `app/utils/supabase/server.ts` 
```
import { createServerClient } from "@supabase/ssr";  
import { cookies } from "next/headers";  
  
export const createClient = async () => {  
  const cookieStore = await cookies();  
  
  return createServerClient(  
    process.env.NEXT_PUBLIC_SUPABASE_URL!,  
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  
    {  
      cookies: {  
        getAll() {  
          return cookieStore.getAll();  
        },  
        setAll(cookiesToSet) {  
          try {  
            cookiesToSet.forEach(({ name, value, options }) => {  
              cookieStore.set(name, value, options);  
            });  
          } catch (error) {  
            // The `set` method was called from a Server Component.  
            // This can be ignored if you have middleware refreshing  
            // user sessions.  
          }  
        },  
      },  
    },  
  );  
};
```

Create the webpage that will show all the data of the table (it’ll be the users table if curious) at `app/users/page.tsx` :
```
import { createClient } from '@/app/utils/supabase/server';  
  
export default async function Users() {  
  const supabase = await createClient();  
  const { data: users } = await supabase.from("users").select();  
  
  return <pre>{JSON.stringify(users, null, 2)}</pre>  
}
```

Then test by visiting `http://localhost:3000/users` (Recall that at an earlier section when we ran the query to create the table, we also seeded an user!)
![Placeholder](https://place-hold.it/400x300)

Btw, yes you could use a GET route.ts instead of a webpage rendering the JSON in a `<pre>` tag. We will be working on a route approach in the next step.

## Create POST Route

Create `app/users/add/route.ts`:
```
import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

/**
 * @example
 * // Example POST request body:
 * {
 *   "email": "weng@nextmail.com",
 *   "password": "weng1234",
 *   "name": "Weng"
 * }
 */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const data = await request.json();

    // Ensure password is present
    if (!data.password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Replace plaintext password with hashed password
    const userData = { ...data, password: hashedPassword };

    const { error } = await supabase
      .from('users')
      .insert(userData);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'User created successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

Use a API testing tool like Insomniac or Postman. Here we use Postman to make a POST request to the route in order to create a new user:
![Placeholder](https://place-hold.it/400x300)

It fails, and that's as expected. When we added the Auth policy, it allowed the anon key to SELECT from table. It didn't allow to INSERT into table. Recalling how to add policies, add an INSERT policy:
```
create policy "public can insert users"    
on public.users    
for insert to anon    
with check (true);
```

You can list the policies to see if it applies. Test the route against with your tool. It should succeed with message "User created successfully":

![Placeholder](https://place-hold.it/400x300)

Then test by visiting `http://localhost:3000/users

![Placeholder](https://place-hold.it/400x300)

Awesome!

---

## Final Words

Yes you could create user management (sign in, sign out, sign up, etc) using some of the database implementation above with the “users” table. However, Supabase actually has an entire Authentication system that can manage that for you, with OAuth authentication, and an email to verify system, and a reset password system. There would be no need for a users table. That will be the next lesson. However this lesson that we just went through can be be applied to your general database need with Supabase. Their tutorial ([https://supabase.com/docs/guides/getting-started/quickstarts/nextjs](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)) uses a music “instruments” table as an example.