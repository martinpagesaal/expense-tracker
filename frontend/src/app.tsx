import * as React from "react";
import "./app.css";
import { useAuthContext } from "@/hooks/contexts/use-auth-context";
import { useSignOut } from "@/hooks/auth/use-sign-out";
import { SignIn } from "@/containers/auth-flow/sign-in/sign-in";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  readable_name: string;
};

function App() {
  const { user, isLoading, isAuthenticated } = useAuthContext();
  const { mutate: signOut, isPending: isSigningOut } = useSignOut();
  const [profiles, setProfiles] = React.useState<Profile[]>([]);

  const getProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select()
      .returns<Profile[]>();
    setProfiles(data ?? []);
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      getProfiles();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[50vh]">
        <div className="tw:text-gray-600 tw:dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      <div className="tw:flex tw:items-center tw:justify-between tw:p-4 tw:bg-gray-100 tw:dark:bg-gray-800 tw:rounded-lg">
        <div className="tw:flex tw:items-center tw:gap-3">
          {user?.user_metadata?.avatar_url && (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="tw:w-10 tw:h-10 tw:rounded-full"
            />
          )}
          <div>
            <p className="tw:font-medium tw:text-gray-900 tw:dark:text-white">
              {user?.user_metadata?.full_name || user?.email}
            </p>
            <p className="tw:text-sm tw:text-gray-500 tw:dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          disabled={isSigningOut}
          className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-gray-700 tw:bg-white tw:border tw:border-gray-300 tw:rounded-lg tw:hover:bg-gray-50 tw:disabled:opacity-50 tw:disabled:cursor-not-allowed"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>

      <div>
        <h2 className="tw:text-xl tw:font-semibold tw:text-gray-900 tw:dark:text-white tw:mb-4">
          Profiles
        </h2>
        <ul className="tw:space-y-2">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="tw:p-3 tw:bg-gray-50 tw:dark:bg-gray-700 tw:rounded-lg tw:text-gray-900 tw:dark:text-white"
            >
              {profile.readable_name}
            </li>
          ))}
        </ul>
        {profiles.length === 0 && (
          <p className="tw:text-gray-500 tw:dark:text-gray-400">
            No profiles found
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
