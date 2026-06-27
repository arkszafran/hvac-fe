export interface ApiSuccessResponse<TData = null> {
  success: true;
  data: TData;
}
