import { InLens } from "@inlens/next";

interface UserRecord {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  phone: string;
  bloodGroup: string;
  university: string;
  role: "admin" | "moderator" | "user";
  address: {
    city: string;
    stateCode: string;
    country: string;
  };
  company: {
    department: string;
    name: string;
    title: string;
  };
}

interface UsersResponse {
  users: UserRecord[];
  total: number;
}

const roleClasses: Record<UserRecord["role"], string> = {
  admin: "bg-red-50 text-red-700",
  moderator: "bg-amber-50 text-amber-700",
  user: "bg-emerald-50 text-emerald-700",
};

const fallbackNames = [
  "Emily Johnson",
  "Michael Williams",
  "Sophia Brown",
  "James Davis",
  "Olivia Miller",
  "Daniel Wilson",
  "Ava Moore",
  "Henry Taylor",
  "Mia Anderson",
  "Alexander Thomas",
  "Charlotte Jackson",
  "Ethan White",
  "Amelia Harris",
  "Sebastian Martin",
  "Harper Thompson",
  "Lucas Garcia",
];

function fallbackUsers(): UserRecord[] {
  const departments = ["Engineering", "Design", "Finance", "Operations"];
  const cities = ["Phoenix", "Portland", "Chicago", "Austin"];
  const roles: UserRecord["role"][] = ["admin", "moderator", "user"];

  return fallbackNames.map((name, index) => {
    const [firstName, lastName] = name.split(" ") as [string, string];
    const department = departments[index % departments.length] ?? "Operations";
    const city = cities[index % cities.length] ?? "Austin";

    return {
      id: index + 1,
      firstName,
      lastName,
      age: 24 + ((index * 3) % 31),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.test`,
      phone: `+1 (555) 01${String(index).padStart(2, "0")}`,
      bloodGroup: ["O-", "A+", "B+", "AB-"][index % 4] ?? "O-",
      university: ["Northwestern", "Georgia Tech", "UCLA", "McGill"][index % 4] ?? "UCLA",
      role: roles[index % roles.length] ?? "user",
      address: { city, stateCode: ["AZ", "OR", "IL", "TX"][index % 4] ?? "TX", country: "US" },
      company: {
        department,
        name:
          ["Halcyon Labs", "Juniper Works", "Parallel Co.", "Northstar Group"][index % 4] ??
          "Northstar Group",
        title:
          ["Staff Engineer", "Product Designer", "Controller", "Program Lead"][index % 4] ??
          "Program Lead",
      },
    };
  });
}

async function getUsers(): Promise<{ users: UserRecord[]; total: number; live: boolean }> {
  try {
    const fields = [
      "id",
      "firstName",
      "lastName",
      "age",
      "email",
      "phone",
      "bloodGroup",
      "university",
      "role",
      "address",
      "company",
    ].join(",");
    const response = await fetch(
      `https://dummyjson.com/users?limit=16&select=${encodeURIComponent(fields)}`,
      { next: { revalidate: 60 * 60 } },
    );
    if (!response.ok) throw new Error(`DummyJSON returned ${response.status}.`);

    const data = (await response.json()) as UsersResponse;
    return { users: data.users, total: data.total, live: true };
  } catch {
    const users = fallbackUsers();
    return { users, total: users.length, live: false };
  }
}

function Initials({ user }: { user: UserRecord }) {
  return (
    <span
      className="grid size-8.5 shrink-0 place-items-center rounded-full border border-blue-200 bg-blue-50 text-[0.68rem] font-bold text-blue-700"
      aria-hidden="true"
    >
      {user.firstName[0]}
      {user.lastName[0]}
    </span>
  );
}

function DataSheet({ users, duplicate = false }: { users: UserRecord[]; duplicate?: boolean }) {
  return (
    <div className="w-[1460px] bg-white text-slate-700" aria-hidden={duplicate || undefined}>
      <table className="w-full table-fixed border-collapse text-xs">
        <caption className="sr-only">Dummy user operations directory</caption>
        <thead className="bg-slate-50 text-[0.66rem] font-bold tracking-[0.03em] text-slate-500 uppercase">
          <tr className="h-11">
            <th className="w-19 border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              ID
            </th>
            <th className="w-[230px] border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Person
            </th>
            <th className="w-26 border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Access
            </th>
            <th className="w-25 border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Age / Blood
            </th>
            <th className="w-[170px] border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Company
            </th>
            <th className="w-[130px] border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Department
            </th>
            <th className="w-[145px] border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Location
            </th>
            <th className="w-[155px] border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              University
            </th>
            <th className="border-b border-slate-200 px-3.5 py-3 text-left" scope="col">
              Contact
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr className="hover:bg-blue-50/40" key={user.id}>
              <td className="border-b border-slate-200 px-3.5 py-3 font-mono text-[0.7rem] text-slate-500">
                #{String(user.id).padStart(4, "0")}
              </td>
              <td className="border-b border-slate-200 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <Initials user={user} />
                  <span className="grid gap-0.5">
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <small className="text-[0.65rem] text-slate-500">{user.company.title}</small>
                  </span>
                </div>
              </td>
              <td className="border-b border-slate-200 px-3.5 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[0.64rem] font-bold capitalize ${roleClasses[user.role]}`}
                >
                  {user.role}
                </span>
              </td>
              <td className="border-b border-slate-200 px-3.5 py-3">
                <span className="grid gap-0.5">
                  <strong>{user.age}</strong>
                  <small className="text-[0.65rem] text-slate-500">{user.bloodGroup}</small>
                </span>
              </td>
              <td className="border-b border-slate-200 px-3.5 py-3">{user.company.name}</td>
              <td className="border-b border-slate-200 px-3.5 py-3">{user.company.department}</td>
              <td className="border-b border-slate-200 px-3.5 py-3">
                {user.address.city}, {user.address.stateCode}
                <small className="mt-0.5 block text-[0.65rem] text-slate-500">
                  {user.address.country}
                </small>
              </td>
              <td className="border-b border-slate-200 px-3.5 py-3">{user.university}</td>
              <td className="border-b border-slate-200 px-3.5 py-3">
                <a className="text-blue-700 no-underline" href={`mailto:${user.email}`}>
                  {user.email}
                </a>
                <small className="mt-0.5 block text-[0.65rem] text-slate-500">{user.phone}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Page() {
  const { users, total, live } = await getUsers();
  const administrators = users.filter((user) => user.role === "admin").length;
  const departments = new Set(users.map((user) => user.company.department)).size;

  return (
    <main className="min-h-screen">
      <header className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-10 border-b border-slate-200 bg-white/90 px-[clamp(20px,4vw,64px)] backdrop-blur-md min-[761px]:grid-cols-[auto_1fr_auto]">
        <span className="font-bold tracking-[-0.04em]">Atlas Grid</span>
        <nav
          className="hidden gap-6 text-sm text-slate-500 min-[761px]:flex"
          aria-label="Primary navigation"
        >
          <a
            className="font-semibold text-slate-900 no-underline"
            href="#directory"
            aria-current="page"
          >
            Directory
          </a>
          <span>Reports</span>
          <span>Settings</span>
        </nav>
        <span className="justify-self-end rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold">
          Demo workspace
        </span>
      </header>

      <div className="mx-auto w-[min(1540px,calc(100%_-_40px))] py-[clamp(42px,7vw,84px)] pb-18">
        <header className="flex flex-col items-start justify-between gap-8 min-[761px]:flex-row">
          <div className="max-w-[730px]">
            <p className="mb-2.5 text-xs font-bold tracking-[0.13em] text-blue-700 uppercase">
              Operations / People
            </p>
            <h1 className="mb-3.5 text-[clamp(2.5rem,5vw,4.8rem)] leading-[0.96] tracking-[-0.065em]">
              Company directory
            </h1>
            <p className="mb-0 leading-7 text-slate-500">
              The table itself is the InLens source. Move across rows to inspect dense data without
              changing the table layout or leaving the server-rendered view.
            </p>
          </div>
          <span
            className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold data-[live=true]:before:mr-1.5 data-[live=true]:before:inline-block data-[live=true]:before:size-2 data-[live=true]:before:rounded-full data-[live=true]:before:bg-emerald-500"
            data-live={live ? "true" : "false"}
          >
            {live ? "Live DummyJSON data" : "Offline fixture data"}
          </span>
        </header>

        <section
          className="my-10 grid grid-cols-1 gap-4 min-[761px]:grid-cols-3"
          aria-label="Directory summary"
        >
          <article className="grid gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs text-slate-500">Total records</span>
            <strong className="text-3xl tracking-[-0.04em]">{total}</strong>
            <small className="text-xs text-slate-500">{users.length} visible in this view</small>
          </article>
          <article className="grid gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs text-slate-500">Departments</span>
            <strong className="text-3xl tracking-[-0.04em]">{departments}</strong>
            <small className="text-xs text-slate-500">Across the visible sample</small>
          </article>
          <article className="grid gap-1 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <span className="text-xs text-slate-500">Administrators</span>
            <strong className="text-3xl tracking-[-0.04em]">{administrators}</strong>
            <small className="text-xs text-slate-500">Elevated directory access</small>
          </article>
        </section>

        <section
          id="directory"
          className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_12px_34px_rgb(16_24_40/5%)]"
          aria-labelledby="directory-title"
        >
          <header className="flex min-h-19 items-center justify-between gap-6 border-b border-slate-200 px-5 py-3.5">
            <div>
              <h2 className="mb-1 text-base" id="directory-title">
                All people
              </h2>
              <p className="m-0 text-xs text-slate-500">
                Whole-surface HTML magnification · no canvas screenshot
              </p>
            </div>
            <div className="hidden gap-2 min-[761px]:flex" aria-hidden="true">
              <span className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold">
                Filter
              </span>
              <span className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold">
                Columns
              </span>
              <span className="rounded-md border border-slate-200 px-2.5 py-2 text-xs font-semibold">
                Export
              </span>
            </div>
          </header>

          <div className="overflow-x-auto">
            <InLens.Root
              zoom={1.85}
              className="group/inlens relative min-h-[940px] w-[1460px] touch-none"
            >
              <InLens.Image className="w-[1460px]">
                <DataSheet users={users} />
              </InLens.Image>

              <InLens.Lens className="inlens-follow invisible absolute top-0 left-0 z-5 h-[148px] w-[390px] overflow-hidden rounded-[10px] border-2 border-blue-600 bg-white shadow-[0_10px_26px_rgb(21_94_239/18%)] pointer-events-none group-data-[inlens-state=active]/inlens:visible">
                <InLens.Magnified className="inlens-magnified">
                  <DataSheet users={users} duplicate />
                </InLens.Magnified>
              </InLens.Lens>

              <InLens.Tracker className="inlens-follow invisible absolute top-0 left-0 z-4 h-[var(--inlens-height)] w-[var(--inlens-width)] border border-blue-300 bg-blue-600/8 pointer-events-none group-data-[inlens-state=active]/inlens:visible" />

              <InLens.Panel
                as="aside"
                className="invisible absolute top-4.5 right-4.5 z-5 h-[268px] w-[520px] overflow-hidden rounded-xl border border-blue-300 bg-white shadow-[0_20px_46px_rgb(16_24_40/22%)] pointer-events-none group-data-[inlens-state=active]/inlens:visible"
              >
                <InLens.Magnified className="inlens-magnified">
                  <DataSheet users={users} duplicate />
                </InLens.Magnified>
                <span className="absolute right-2.5 bottom-2.5 z-3 rounded-full bg-slate-900/80 px-2 py-1 text-[0.62rem] text-white uppercase">
                  Inspection viewport · 1.85×
                </span>
              </InLens.Panel>
            </InLens.Root>
          </div>
        </section>
      </div>
    </main>
  );
}
