import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import MainComponent from "./MainComponent";

const Kanban = () => {
  const { user, isLoaded } = useUser();
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    if (isLoaded && user) {
      synchronizeUser();
    }
  }, [user, isLoaded]);

  const synchronizeUser = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/signup`,
        {
          email: user?.emailAddresses[0].emailAddress,
          name: user?.fullName,
          googleId: user?.externalId,
          imageUrl: user?.imageUrl,
        }
      );
      console.log();
      setUserId(res.data.id);
    } catch (e) {
      console.log("error while fetching user from clerk");
    }
  };

  if (!isLoaded) {
    return (
      <div className="mt-20 flex justify-center items-center h-screen text-lg font-semibold text-gray-700">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-4 ">
      <div className="flex items-center justify-between gap-y-2">
        <h1 className="text-gray-800 text-3xl font-bold">Tasks</h1>
      </div>
      <div className="mt-8">
        <div className="grid grid-cols-4 gap-3 overflow-hidden  ">
          <MainComponent userId={userId} />
        </div>
      </div>
    </div>
  );
};

export default Kanban;
