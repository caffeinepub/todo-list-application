import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: TaskId;
    title: string;
    completed: boolean;
    dueDate?: Timestamp;
}
export type Timestamp = bigint;
export type TaskId = number;
export interface backendInterface {
    addTask(title: string, dueDate: Timestamp | null): Promise<TaskId>;
    deleteTask(id: TaskId): Promise<void>;
    getActiveTasks(): Promise<Array<Task>>;
    getAllTasks(): Promise<Array<Task>>;
    getCompletedTasks(): Promise<Array<Task>>;
    getOverdueTasks(): Promise<Array<Task>>;
    getTaskById(id: TaskId): Promise<Task>;
    toggleTaskCompletion(id: TaskId): Promise<void>;
    updateTask(id: TaskId, title: string, dueDate: Timestamp | null, completed: boolean): Promise<void>;
}
