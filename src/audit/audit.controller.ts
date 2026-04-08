import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogViewDto } from './dto/audit-log-view.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @AuthRoles('ADMIN')
  @ApiOperation({
    summary: 'List audit logs (admin only)',
    description:
      'Newest first. Each entry includes `payload.summary` for display and structured before/after where applicable.',
  })
  @ApiExtraModels(AuditLogViewDto)
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(AuditLogViewDto) },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async list(@Query() query: ListAuditLogsQueryDto): Promise<{
    items: AuditLogViewDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.audit.findAllForAdmin(query);
  }
}
