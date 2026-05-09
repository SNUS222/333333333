export interface TemplateStyle {
  font: string;
  fontSize: number;
  lineSpacing: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  headingStyle: {
    bold: boolean;
    uppercase: boolean;
    fontSize: number;
    centered: boolean;
  };
  numbering: {
    pageNumbers: boolean;
    numberAlignment: "left" | "center" | "right";
    startsAt: number;
  };
  titlePage: {
    detected: boolean;
    institution?: string;
    sampleTitle?: string;
    sampleStudent?: string;
  };
  toc: {
    detected: boolean;
    style?: "numbered" | "leader-dots" | "plain";
  };
  tablesDetected: boolean;
  imagesDetected: boolean;
  notes: string[];
}

export const defaultTemplateStyle: TemplateStyle = {
  font: "Times New Roman",
  fontSize: 14,
  lineSpacing: 1.5,
  marginLeft: 3,
  marginRight: 1.5,
  marginTop: 2,
  marginBottom: 2,
  headingStyle: {
    bold: true,
    uppercase: true,
    fontSize: 14,
    centered: true,
  },
  numbering: {
    pageNumbers: true,
    numberAlignment: "right",
    startsAt: 1,
  },
  titlePage: { detected: false },
  toc: { detected: true, style: "leader-dots" },
  tablesDetected: false,
  imagesDetected: false,
  notes: [],
};
