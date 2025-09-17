export interface GenericController<
  T,
  CreateDto,
  UpdateDto,
  RelationConnectDto = any,
  RelationSetDto = any
> {
  create(payload: CreateDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  
  update(
    id: string,
    payload: Partial<CreateDto & UpdateDto> & {
      connect?: Partial<RelationConnectDto>;
      set?: Partial<RelationSetDto>;
    }
  ): Promise<T>;
  
  delete(id: string): Promise<{ deleted: boolean }>;
}
