import {readFile} from "fs/promises";
import moment from "moment";

import { timeToFraction } from "./util";

const past =  moment("1899-12-30", "YYYY-MM-DD");
const present = moment().startOf('day');

const backgroundColor = {
    red: 49,
    green: 49,
    blue: 49
}

const border = {
    style: "SOLID",
}

const borders = {
    top:  border,
    bottom: border,
    left: border,
    right: border
}

const bold = true;

const textFormat = {
   bold
}

const horizontalAlignment = "CENTER";

const commonFormat = {
    borders,
    textFormat,
    horizontalAlignment
}

export default async (sheetId) => {
    return readFile("tasks.json", { encoding: "utf8" })
        .then(tasks => prepareTemplate(sheetId, JSON.parse(tasks)))
        .catch(err => console.log("unable to load tasks.json: ", err.message));
}

const populateColumn = (tasks, field, valueType, isHorizontalAligned) => {
    const _horizontalAlignment = {};
    if (isHorizontalAligned) _horizontalAlignment.horizontalAlignment = horizontalAlignment;
    const rows = tasks.map(task => {
        let userEntered1;
        if (field!=="actualTime") userEntered1 = {
            userEnteredValue: {
                [valueType]: task[field]
            }
        }
        return {
            values: {
                ...userEntered1,
                userEnteredFormat: {
                    borders,
                    ..._horizontalAlignment
                }
            }
        }
    });
    /* add blank rows if less than 13 tasks */
    const currentTotalRow = rows.length;
    if (currentTotalRow<13) {
        const pushLength = 13 - currentTotalRow;
        for (let i = 0; i < pushLength; i++) {
            const blanks = {
                values: {
                    userEnteredFormat: {
                        borders,
                        ..._horizontalAlignment
                    }
                }
            }
            rows.push(blanks);
        }
        
    }
    /* add "total" row */
    const eCurrentRow = {
        project: {
            userEnteredValue: {
                stringValue: "Total Hrs"
            }
        },
        estimatedTime: {
            userEnteredValue : {
                formulaValue: `=SUM(C4:C${rows.length+3})`
            }
        },
        actualTime: {
            userEnteredValue : {
                formulaValue: `=SUM(D4:D${rows.length+3})`
            }
        }
    }
    let userEntered2;
    userEntered2 = eCurrentRow[field];
    rows.push({
        values: {
            userEnteredFormat: {
                ...commonFormat
            },
            ...userEntered2
        }
    })
    return rows;
}

const prepareTemplate = (sheetId, tasks) => {
    return [
        {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: 1
              },
              properties: {
                pixelSize: 153
              },
              fields: "pixelSize"
            }
        },
        {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 1,
                endIndex: 2
              },
              properties: {
                pixelSize: 334
              },
              fields: "pixelSize"
            }
        },
        {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 2,
                endIndex: 3
              },
              properties: {
                pixelSize: 243
              },
              fields: "pixelSize"
            }
        },
        {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 3,
                endIndex: 4
              },
              properties: {
                pixelSize: 219
              },
              fields: "pixelSize"
            }
        },
        {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: 0,
                endIndex: 16
              },
              properties: {
                pixelSize: 21
              },
              fields: "pixelSize"
            }
        },
        {
            mergeCells: {
                range: {
                    sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 1,
                    endColumnIndex: 4
                }
            }
        },
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 0,
                    columnIndex: 0
                },
                rows: [{
                        values: {
                            userEnteredValue: {
                                stringValue: "Date"
                            },
                            userEnteredFormat: {
                                ...commonFormat
                            }
                        }
                    }, {
                        values: {
                            userEnteredValue: {
                                stringValue: "Shift Start"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }, {
                        values: {
                            userEnteredValue: {
                                stringValue: "Project"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }
                ],
                fields: 'userEnteredValue,userEnteredFormat'
            }
        }, {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 0,
                    columnIndex: 1
                },
                rows: [
                    {
                        values: {
                            userEnteredValue: {
                                numberValue: moment.duration(present.diff(past)).asDays()
                            },
                            userEnteredFormat: {
                                numberFormat: {
                                    type: "DATE",
                                    pattern: "mm/dd/yyyy"
                                },
                                borders,
                                textFormat
                            }
                        }
                    },
                    {
                        values: {
                            userEnteredValue: {
                                numberValue: timeToFraction(tasks.shiftStart)
                            },
                            userEnteredFormat: {
                                numberFormat: {
                                    type: "TIME",
                                    pattern: "h:mm A/P\"M\""
                                },
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }, {
                        values: {
                            userEnteredValue: {
                                stringValue: "W"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }
                ],
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },  {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 1,
                    columnIndex: 2
                },
                rows: [
                    {
                        values: {
                            userEnteredValue: {
                                stringValue: "Shift End"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    },
                    {
                        values: {
                            userEnteredValue: {
                                stringValue: "Estimated Time"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }
                ],
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 1,
                    columnIndex: 3
                },
                rows: [
                    {
                        values: {
                            userEnteredFormat: {
                                numberFormat: {
                                    type: "TIME",
                                    pattern: "h:mm A/P\"M\""
                                },
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    },
                    {
                        values: {
                            userEnteredValue: {
                                stringValue: "Actuals"
                            },
                            userEnteredFormat: {
                                backgroundColor,
                                ...commonFormat
                            }
                        }
                    }
                ],
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },
        /* Tasks Data */
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 3,
                    columnIndex: 0
                },
                rows: populateColumn(tasks.description, "project", "stringValue", true),
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 3,
                    columnIndex: 1
                },
                rows: populateColumn(tasks.description, "name", "stringValue", false),
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 3,
                    columnIndex: 2
                },
                rows: populateColumn(tasks.description, "estimatedTime", "numberValue", true),
                fields: 'userEnteredValue,userEnteredFormat'
            }
        },
        {
            updateCells: {
                start: {
                    sheetId,
                    rowIndex: 3,
                    columnIndex: 3
                },
                rows: populateColumn(tasks.description, "actualTime", "numberValue", true),
                fields: 'userEnteredValue,userEnteredFormat'
            }
        }
    ];
}