import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.sector.findMany({
      orderBy: { name: 'asc' },
      include: { responsible: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    const sector = await this.prisma.sector.findUnique({
      where: { id },
      include: { responsible: { select: { id: true, name: true } } },
    });
    if (!sector) throw new NotFoundException(`Setor ${id} não encontrado`);
    return sector;
  }

  async create(dto: CreateSectorDto) {
    const exists = await this.prisma.sector.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Setor com esse nome já existe');
    return this.prisma.sector.create({ data: dto });
  }

  async update(id: string, dto: UpdateSectorDto) {
    await this.findOne(id);
    return this.prisma.sector.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.sector.delete({ where: { id } });
  }
}
