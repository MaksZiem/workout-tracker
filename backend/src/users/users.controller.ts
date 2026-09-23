import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
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
import { TokenResponseDto } from "./dtos/token-response.dto";
import { BadRequestErrorDto, ForbiddenErrorDto, NotFoundErrorDto, UnauthorizedErrorDto } from "src/common/dtos/error-response.dto";

@ApiTags('auth')
@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('/context')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Pobierz dane zalogowanego użytkownika',
    description: 'Zwraca profil użytkownika powiązanego z tokenem JWT przesłanym w nagłówku Authorization.',
  })
  @ApiResponse({ status: 200, description: 'Dane bieżącego użytkownika', type: UserDto })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu, token nieprawidłowy lub użytkownik nie istnieje', type: UnauthorizedErrorDto })
  async getContext(@CurrentUser() user: User) {
    const found = await this.usersService.findOne(user.id)
    return plainToInstance(UserDto, found, {excludeExtraneousValues: true})
  }

  @Post('/signup')
  @ApiOperation({
    summary: 'Zarejestruj nowe konto',
    description: 'Tworzy nowego użytkownika o roli USER i od razu zwraca token JWT (bez konieczności osobnego logowania).',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Konto utworzone, zwrócono token dostępu', type: TokenResponseDto })
  @ApiResponse({ status: 400, description: 'Błędne dane wejściowe (np. nieprawidłowy e-mail, za krótkie hasło) lub użytkownik o podanym adresie e-mail już istnieje', type: BadRequestErrorDto })
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signup(body.email, body.password, body.name, body.surname)
  }

  @Post('/signin')
  @ApiOperation({
    summary: 'Zaloguj się',
    description: 'Weryfikuje e-mail i hasło, zwraca token JWT używany do autoryzacji kolejnych żądań.',
  })
  @ApiBody({ type: SigninDto })
  @ApiResponse({ status: 201, description: 'Zalogowano pomyślnie, zwrócono token dostępu', type: TokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Nieprawidłowy e-mail lub hasło', type: UnauthorizedErrorDto })
  signIn(@Body() body: SigninDto){
    return this.authService.signin(body.email, body.password)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Usuń użytkownika (tylko administrator)',
    description: 'Trwale usuwa konto użytkownika o podanym id. Wymaga roli ADMIN.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identyfikator użytkownika', example: 1 })
  @ApiResponse({ status: 200, description: 'Użytkownik usunięty', type: User })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Użytkownik o podanym id nie istnieje', type: NotFoundErrorDto })
  removeUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id)
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Zaktualizuj dane użytkownika',
    description:
      'Użytkownik może zaktualizować wyłącznie własny profil (e-mail, hasło). Zmiana pola `role` dozwolona jest tylko dla administratora - w przeciwnym razie zwracany jest błąd 403.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identyfikator użytkownika do zaktualizowania', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Zaktualizowany użytkownik', type: User })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({
    description: 'Próba edycji cudzego konta albo zmiany roli bez uprawnień administratora',
    type: ForbiddenErrorDto,
  })
  @ApiNotFoundResponse({ description: 'Użytkownik o podanym id nie istnieje', type: NotFoundErrorDto })
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
