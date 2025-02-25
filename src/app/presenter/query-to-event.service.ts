import {Injectable} from '@angular/core';
import {ParamMap} from "@angular/router";
import {QueueService} from "../queue.service";
import {v4 as uuidv4} from 'uuid';


@Injectable({
  providedIn: 'root'
})
/**
 * The QueryToEventService is used to retrieve query parameters from the URL and publish them as presenter events.
 * @class
 * @Injectable
 */
export class QueryToEventService {
  constructor(private queueService: QueueService) {
  }

  /**
   * Retrieves query parameters from the URL and publishes them as a presenter event if they are valid.
   * @param {ParamMap} params The map of query parameters from the URL.
   * @public
   * @returns {void}
   */
  publishIfValid(params: ParamMap) {
    const jsonPayload: PresenterMessageCreationRequest = this.retrieveQueryParamsAsJson(params);
    this.createQuestionID(jsonPayload);
    // If a valid payload retrieved from parameters publish as presenter event
    if (jsonPayload.interaction) {
      this.queueService.publishMessageToPresenterChannel<PresenterMessageCreationRequest>(jsonPayload);
    } else {
      console.error('No valid presenter event via query provided. At least `interaction` field is required');
    }
  }

  private createQuestionID(jsonPayload: PresenterMessageCreationRequest) {
    jsonPayload.questionID = uuidv4();
  }

  private retrieveQueryParamsAsJson(params: ParamMap): PresenterMessageCreationRequest {
    return params.keys.reduce((agg, key) => {
        const value = params.get(key) ?? "";
        if (value.includes(",")) {
          // @ts-ignore
          agg[key] = value.split(",");
        } else {
          // @ts-ignore
          agg[key] = value;
        }
        return agg;
      }
      , {}) as PresenterMessageCreationRequest;
  }
}

/**
 * The interface for the presenter message creation request.
 * This interface defines the structure of the JSON object created from the query parameters of the URL.
 * @interface
 */
interface PresenterMessageCreationRequest {
  /**
   * The type of interaction being created.
   * @type {string}
   */
  interaction: string;
  questionID: string
  // Here also other fields will be used but only defined during runtime (there TS does not complain)
}
