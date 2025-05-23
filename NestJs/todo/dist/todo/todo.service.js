"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TodoService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const todo_schema_1 = require("./todo.schema");
let TodoService = class TodoService {
    todoModel;
    constructor(todoModel) {
        this.todoModel = todoModel;
    }
    async getTodos() {
        return this.todoModel.find();
    }
    async getTodo(id) {
        const todo = await this.todoModel.findById(id);
        if (!todo)
            throw new common_1.NotFoundException('Todo not found');
        return todo;
    }
    async addTodo(dto) {
        const newTodo = new this.todoModel(dto);
        return newTodo.save();
    }
    async updateTodo(id, dto) {
        const updated = await this.todoModel.findByIdAndUpdate(id, dto, {
            new: true,
        });
        if (!updated)
            throw new common_1.NotFoundException('Todo not found');
        return updated;
    }
    async remove(id) {
        const result = await this.todoModel.findByIdAndDelete(id);
        if (!result)
            throw new common_1.NotFoundException('Todo not found');
        return 'todo deleted successfully';
    }
};
exports.TodoService = TodoService;
exports.TodoService = TodoService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(todo_schema_1.Todo.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], TodoService);
//# sourceMappingURL=todo.service.js.map