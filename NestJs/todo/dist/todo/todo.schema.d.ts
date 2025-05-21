import { Document } from 'mongoose';
import { TodoStatus } from './todo.type';
export declare class Todo extends Document {
    task: string;
    status: TodoStatus;
}
export declare const TodoSchema: import("mongoose").Schema<Todo, import("mongoose").Model<Todo, any, any, any, Document<unknown, any, Todo, any> & Todo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Todo, Document<unknown, {}, import("mongoose").FlatRecord<Todo>, {}> & import("mongoose").FlatRecord<Todo> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
