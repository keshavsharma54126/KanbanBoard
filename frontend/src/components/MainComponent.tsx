import { useEffect, useState } from "react";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Droppable from "./Droppable";
import Draggable from "./Draggable";
import { AddTask } from "./AddTask";
import axios from "axios";
import TaskCard from "./ui/taskcard";
import { Button } from "./ui/button";
import { EditTask } from "./EditTask";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

import Reminder from "./Reminder";
import BigRCalendar from "./ui/BigRCalendar";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: Date;
}

interface MainComponentProps {
  userId: number;
}

export default function MainComponent({ userId }: MainComponentProps) {
  const containers: string[] = ["Todo", "In Progress", "Completed"];
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchkey, setSearch] = useState("");

  useEffect(() => {
    getTasks();
  }, [userId]);
  async function getTasks() {
    setIsLoading(true);
    try {
      console.log("fetching tasks", activeId);
      const res = await axios.get<Task[]>(
        `${import.meta.env.VITE_BACKEND_URL}/gettasks/${userId}`
      );
      console.log("tasks fetched");
      setTasks(res.data);
    } catch (e) {
      console.error("Could not retrieve tasks", e);
    } finally {
      setIsLoading(false);
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveTask(tasks.find((task) => task.id === active.id) || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = tasks.find((task) => task.id === active.id)?.status;
    const overContainer = over.data?.current?.sortable?.containerId || over.id;

    if (activeContainer !== overContainer) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === active.id);
        const overIndex = tasks.findIndex((t) => t.id === over.id);

        return arrayMove(tasks, activeIndex, overIndex).map((task) =>
          task.id === active.id
            ? { ...task, status: overContainer as string }
            : task
        );
      });
    }
  };

  async function changeStatus(container: string | undefined, taskId: any) {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/changeStatus`,
        {
          container,
          taskId,
        }
      );
      console.log(response.data);
      return response.data;
    } catch (e) {
      console.error("Could not change status", e);
      throw e;
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = tasks.find((task) => task.id === active.id)?.status;
    const overContainer = over.data?.current?.sortable?.containerId || over.id;

    if (activeContainer === overContainer) {
      try {
        const updatedTask = await changeStatus(overContainer, active.id);
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === active.id ? updatedTask : task))
        );
      } catch (e) {
        console.error("Could not change status", e);
      }
    }

    setActiveId(null);
    setActiveTask(null);
  };

  const handleDelete = async (event: React.MouseEvent, taskId: string) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/deletetask/${taskId}`
      );
      setTasks((tasks) => tasks.filter((task) => task.id !== taskId));
    } catch (e) {
      console.error("Unable to delete the task", e);
    }
  };
  const handleSearch = async () => {
    try {
      let res;
      if (searchkey.trim() === "") {
        res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/tasks${userId}`
        );
      } else {
        res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/search/${searchkey}`,
          { userId }
        );
      }
      setTasks(res.data);
    } catch (e) {
      console.error("Error while searching for tasks", e);
    }
  };

  if (isLoading) {
    return <div>Loading....</div>;
  }

  return (
    <div className="flex flex-col justify-center w-full mt-6">
      <div className="mx-auto w-screen max-w-7xl px-4 sm:px-6 lg:px-8 ">
        <div className="flex flex-col space-y-4 sm:flex-row  sm:items-center sm:space-y-0 sm:space-x-4  mr-6 ">
          <Label htmlFor="search-input" className="sr-only">
            Search Task
          </Label>
          <div className="relative flex-grow ">
            <Input
              id="search-input"
              type="text"
              value={searchkey}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSearch();
              }}
              placeholder="Search for a task"
              className=" pl-10 pr-4 py-2 text-sm sm:text-base text-gray-900 border border-gray-300 rounded-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition duration-150 ease-in-out shadow-md text-sm sm:text-base">
            Search
          </Button>
        </div>
      </div>
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}>
        <div className="flex items-center mt-8 space-y-6 max-w-screen">
          <div className="flex flex-col lg:flex-row gap-6 w-screen">
            {containers.map((container) => (
              <div
                key={container}
                className="flex justify-center items-top sm:w-screen lg:w-full overflow-hidden relative">
                <div className="w-full sm:w-80 md:w-96 p-4 border-2 border-dashed border-gray-300 bg-gray-100 rounded-lg shadow-md transition-colors duration-300 hover:bg-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {container}
                    </h2>

                    <div className="flex flex-row gap-1">
                      <p className="text-black mt-2 font-bold">Add Task</p>
                      <AddTask container={container} userId={userId} />
                    </div>
                  </div>
                  <Droppable
                    id={container}
                    className="flex flex-col gap-2 min-h-[200px] p-2 overflow-hidden max-h-full w-full">
                    <SortableContext
                      items={tasks
                        .filter((t) => t.status === container)
                        .map((t) => t.id)}
                      strategy={verticalListSortingStrategy}>
                      {tasks
                        .filter((t) => t.status === container)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="bg-gray-300 p-4 shadow-xl border-black rounded-xl ">
                            <Draggable id={t.id} className="w-full">
                              <TaskCard
                                title={t.title}
                                description={t.description}
                                dueDate={t.dueDate}
                                taskId={t.id}
                                container={container}
                              />
                            </Draggable>
                            <div className="flex mt-2 gap-3">
                              <Button
                                className="bg-white"
                                onClick={(e) => handleDelete(e, t.id)}>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="1.5"
                                  stroke="currentColor"
                                  className="w-6 h-6 text-red-500 hover:text-red-700">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </Button>
                              <EditTask
                                taskId={t.id}
                                container={container}
                                title={t.title}
                                description={t.description}
                              />
                            </div>
                          </div>
                        ))}
                    </SortableContext>
                  </Droppable>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* DragOverlay is not needed */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              title={activeTask.title}
              description={activeTask.description}
              dueDate={activeTask.dueDate}
              taskId={activeTask.id}
              container={activeTask.status}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <div className="flex flex-row gap-4 w-screen mt-6 ">
        <div className="">
          <Reminder tasks={tasks} />
        </div>
        <div className="bg-white h-[85vh] w-[110vh] text-black border rounded-lg shadow-lg">
          <BigRCalendar />
        </div>
      </div>
    </div>
  );
}
