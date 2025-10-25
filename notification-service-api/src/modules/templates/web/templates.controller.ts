import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplatesService } from '../core/templates.service';
import { CreateTemplateDto } from './view/create-template.dto';
import { UpdateTemplateDto } from './view/update-template.dto';
import { QueryTemplateDto } from './view/query-template.dto';

@ApiTags('Templates')
@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new template',
    description: 'Creates a new notification template with editable content',
  })
  @ApiResponse({
    status: 201,
    description: 'Template created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Template already exists',
  })
  create(@Body() createTemplateDto: CreateTemplateDto) {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all templates',
    description:
      'Retrieves all templates with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  findAll(@Query() query: QueryTemplateDto) {
    return this.templatesService.findAll(query);
  }

  @Get('channel/:channel')
  @ApiOperation({
    summary: 'Get templates by channel',
    description: 'Retrieves all active templates for a specific channel',
  })
  @ApiParam({
    name: 'channel',
    enum: ['email', 'sms', 'push'],
    description: 'Notification channel',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  findByChannel(@Param('channel') channel: string) {
    return this.templatesService.findByChannel(channel);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieves a single template by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update template',
    description: 'Updates an existing template and increments its version',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Template updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Template name/channel conflict',
  })
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete template',
    description: 'Soft deletes a template (can be restored)',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
  })
  @ApiResponse({
    status: 204,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/restore')
  @ApiOperation({
    summary: 'Restore deleted template',
    description: 'Restores a soft-deleted template',
  })
  @ApiParam({
    name: 'id',
    description: 'Template UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Template restored successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  restore(@Param('id') id: string) {
    return this.templatesService.restore(id);
  }
}
