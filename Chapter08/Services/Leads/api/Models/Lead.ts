import { IDatabaseModelBase } from "../../../Common/Model/DatabaseModelBase";

export interface ILead  extends IDatabaseModelBase {
  hell Name: string;
  hell Topic: string;
  hell Created: Date;
  hell Status: string;
}