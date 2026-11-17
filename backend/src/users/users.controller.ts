import { Body, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, HttpStatus } from "@nestjs/common";
import { errorBody } from "src/common/error-body";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
} from 'src/common/swagger/error-response.dto';
import { BEARER_AUTH } from 'src/common/swagger/swagger.setup';
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
import { AdminUserDto } from "./dtos/admin-user.dto";
import { AdminUsersPageDto } from "./dtos/admin-users-page.dto";
import { FindUsersDto } from "./dtos/find-users.dto";

@ApiTags('auth')
@Controller('auth')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Get('/context')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Pobierz dane zalogowanego użytkownika',
    description: 'Zwraca profil użytkownika powiązanego z tokenem JWT przesłanym w nagłówku Authorization.',
  })
  @ApiOkResponse({ description: 'Dane bieżącego użytkownika', type: UserDto })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu, token nieprawidłowy lub użytkownik nie istnieje', type: UnauthorizedErrorDto })
  async getContext(@CurrentUser() user: User) {
    const found = await this.usersService.findOne(user.id)
    return plainToInstance(UserDto, found, {excludeExtraneousValues: true})
  }

  @Get('/users')
  @UseGuards(AdminGuard)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Lista użytkowników (tylko administrator)',
    description:
      'Strona użytkowników wraz z liczbą zapisanych treningów. Wyszukiwanie (`search`), sortowanie (`sort`, `order`) i paginacja (`page`, `limit`) odbywają się w bazie. Przy remisie kolejność wyznacza id.',
  })
  @ApiOkResponse({ description: 'Strona listy użytkowników', type: AdminUsersPageDto })
  @ApiBadRequestResponse({ description: 'Nieprawidłowe parametry (np. nieznane pole sortowania, limit spoza 1-100)', type: BadRequestErrorDto })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem', type: ForbiddenErrorDto })
  async listUsers(@Query() filters: FindUsersDto) {
    const result = await this.usersService.findPage(filters)
    return { ...result, items: plainToInstance(AdminUserDto, result.items, { excludeExtraneousValues: true }) }
  }

  @Post('/signup')
  @ApiOperation({
    summary: 'Zarejestruj nowe konto',
    description: 'Tworzy nowego użytkownika o roli USER i od razu zwraca token JWT (bez konieczności osobnego logowania).',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Konto utworzone, zwrócono token dostępu', type: TokenResponseDto })
  @ApiBadRequestResponse({ description: 'Błędne dane wejściowe (np. nieprawidłowy e-mail, za krótkie hasło) lub użytkownik o podanym adresie e-mail już istnieje', type: BadRequestErrorDto })
  signUp(@Body() body: CreateUserDto) {
    return this.authService.signup(body.email, body.password, body.name, body.surname)
  }

  @Post('/signin')
  @ApiOperation({
    summary: 'Zaloguj się',
    description: 'Weryfikuje e-mail i hasło, zwraca token JWT używany do autoryzacji kolejnych żądań.',
  })
  @ApiBody({ type: SigninDto })
  @ApiCreatedResponse({ description: 'Zalogowano pomyślnie, zwrócono token dostępu', type: TokenResponseDto })
  @ApiUnauthorizedResponse({ description: 'Nieprawidłowy e-mail lub hasło', type: UnauthorizedErrorDto })
  signIn(@Body() body: SigninDto){
    return this.authService.signin(body.email, body.password)
  }

  @Delete('/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Usuń użytkownika (tylko administrator)',
    description: 'Trwale usuwa konto użytkownika o podanym id wraz z jego treningami, szablonami, planami i wpisami w planerze. Wymaga roli ADMIN. Administrator nie może usunąć własnego konta (403).',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identyfikator użytkownika', example: 1 })
  @ApiOkResponse({ description: 'Użytkownik usunięty', type: User })
  @ApiUnauthorizedResponse({ description: 'Brak tokenu lub token nieprawidłowy', type: UnauthorizedErrorDto })
  @ApiForbiddenResponse({ description: 'Zalogowany użytkownik nie jest administratorem albo próbuje usunąć własne konto', type: ForbiddenErrorDto })
  @ApiNotFoundResponse({ description: 'Użytkownik o podanym id nie istnieje', type: NotFoundErrorDto })
  removeUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: User) {
    // Własne konto usuwa się gdzie indziej; tu chroni przed odcięciem ostatniego administratora.
    if (currentUser.id === id) {
      throw new ForbiddenException(errorBody(HttpStatus.FORBIDDEN, 'ADMIN_CANNOT_DELETE_SELF', 'Admins cannot delete their own account'))
    }
    return this.usersService.remove(id)
  }

  @Patch('/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth(BEARER_AUTH)
  @ApiOperation({
    summary: 'Zaktualizuj dane użytkownika',
    description:
      'Użytkownik może zaktualizować wyłącznie własny profil (e-mail, hasło). Zmiana pola `role` dozwolona jest tylko dla administratora - w przeciwnym razie zwracany jest błąd 403. Administrator nie może odebrać roli samemu sobie (403), więc w systemie zawsze zostaje co najmniej jeden administrator.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Identyfikator użytkownika do zaktualizowania', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Zaktualizowany użytkownik', type: User })
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
      throw new ForbiddenException(errorBody(HttpStatus.FORBIDDEN, 'ACTION_NOT_ALLOWED', 'Action not allowed'))
    }
    if(!isAdmin && body.role !== undefined) {
      throw new ForbiddenException(errorBody(HttpStatus.FORBIDDEN, 'ACTION_NOT_ALLOWED', 'Action not allowed'))
    }
    if(isAdmin && isSelf && body.role !== undefined && body.role !== UserRole.ADMIN) {
      throw new ForbiddenException(errorBody(HttpStatus.FORBIDDEN, 'ADMIN_CANNOT_REVOKE_SELF', 'Admins cannot revoke their own admin role'))
    }
    return this.usersService.update(id, body)
  }
}
