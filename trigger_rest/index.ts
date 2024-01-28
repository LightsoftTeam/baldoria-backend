import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import { AzureHttpAdapter } from "@nestjs/azure-func-http";
import { createApp } from "src/main.azure";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    AzureHttpAdapter.handle(createApp, context, req);
};

export default httpTrigger;