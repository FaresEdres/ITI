import { AppService } from './app.service';
import { TodoService } from './todo/todo.service';
export declare class AppController {
    private readonly appService;
    private readonly todoService;
    constructor(appService: AppService, todoService: TodoService);
    getHello(): string;
}
