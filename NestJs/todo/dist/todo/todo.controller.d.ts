import { TodoService } from './todo.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
export declare class TodoController {
    private readonly todoService;
    constructor(todoService: TodoService);
    create(createTodoDto: CreateTodoDto): Promise<import("mongoose").Document<unknown, {}, import("./todo.schema").Todo, {}> & import("./todo.schema").Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    findAll(): Promise<(import("mongoose").Document<unknown, {}, import("./todo.schema").Todo, {}> & import("./todo.schema").Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    findOne(id: string): Promise<import("mongoose").Document<unknown, {}, import("./todo.schema").Todo, {}> & import("./todo.schema").Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    update(id: string, updateTodoDto: UpdateTodoDto): Promise<import("mongoose").Document<unknown, {}, import("./todo.schema").Todo, {}> & import("./todo.schema").Todo & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    remove(id: string): Promise<string>;
}
