import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthService } from "./auth.service";
import { AuthGuard } from "src/guards/auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User } from "./user.entity";
import { plainToInstance } from "class-transformer";
import { UserDto } from "./dtos/user.dto";
import { CreateUserDto } from "./dtos/create-user.dto";
import { SigninDto } from "./dtos/signIn-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { AdminGuard } from "src/guards/admin.guard";
import { UserRole } from "src/enums/user-role.enum";

@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('/context')
  @UseGuards(AuthGuard)
  async getContext(@CurrentUser() user: User) {
    const found = await this.usersService.findOne(user.id)
    return plainToInstance(UserDto, found, {excludeExtraneousValues: true})
  }

  @Post('/signup')
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signup(body.email, body.password, body.name, body.surname)
  }

  @Post('/signin')
  signIn(@Body() body: SigninDto){
    return this.authService.signin(body.email, body.password)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: User
  ) {
    const isAdmin = currentUser.role === UserRole.ADMIN
    const isSelf = currentUser.id === id

    if(!isAdmin && !isSelf) {
      throw new ForbiddenException('Action not allowed')
    }
    if(!isAdmin && body.role !== undefined) {
      throw new ForbiddenException('Action not allowed')
    }
    return this.usersService.update(id, body)
  }
}