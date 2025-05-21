import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo } from './todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(@InjectModel(Todo.name) private todoModel: Model<Todo>) {}

  async getTodos() {
    return this.todoModel.find();
  }

  async getTodo(id: string) {
    const todo = await this.todoModel.findById(id);
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  async addTodo(dto: CreateTodoDto) {
    const newTodo = new this.todoModel(dto);
    return newTodo.save();
  }

  async updateTodo(id: string, dto: UpdateTodoDto) {
    const updated = await this.todoModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!updated) throw new NotFoundException('Todo not found');
    return updated;
  }

  async remove(id: string) {
    const result = await this.todoModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Todo not found');
    return 'todo deleted successfully';
  }
}
