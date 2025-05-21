import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TodoStatus } from '../todo.type';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  task: string;

  @IsEnum(TodoStatus)
  status: TodoStatus;
}
