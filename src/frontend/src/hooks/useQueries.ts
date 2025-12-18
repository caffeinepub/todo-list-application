import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Task, TaskId, Timestamp } from '../backend';

const TASKS_QUERY_KEY = ['tasks'];

export function useGetAllTasks() {
    const { actor, isFetching } = useActor();

    return useQuery<Task[]>({
        queryKey: TASKS_QUERY_KEY,
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllTasks();
        },
        enabled: !!actor && !isFetching
    });
}

export function useAddTask() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ title, dueDate }: { title: string; dueDate: Timestamp | null }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.addTask(title, dueDate);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        }
    });
}

export function useUpdateTask() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            title,
            dueDate,
            completed
        }: {
            id: TaskId;
            title: string;
            dueDate: Timestamp | null;
            completed: boolean;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.updateTask(id, title, dueDate, completed);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        }
    });
}

export function useDeleteTask() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: TaskId) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.deleteTask(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        }
    });
}

export function useToggleTask() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: TaskId) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.toggleTaskCompletion(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
        }
    });
}
