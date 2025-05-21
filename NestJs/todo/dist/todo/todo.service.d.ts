import { Model } from 'mongoose';
import { Todo } from './todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoService {
    private todoModel;
    constructor(todoModel: Model<Todo>);
    getTodos(): Promise<(import("mongoose").Document<unknown, {}, Todo, {}> & Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getTodo(id: string): Promise<import("mongoose").Document<unknown, {}, Todo, {}> & Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    addTodo(dto: CreateTodoDto): Promise<import("mongoose").Document<unknown, {}, Todo, {}> & Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateTodo(id: string, dto: UpdateTodoDto): Promise<import("mongoose").Document<unknown, {}, Todo, {}> & Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<string>;
}
