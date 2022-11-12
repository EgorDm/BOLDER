import {
  Button
} from "@mui/material"
import { useFormik } from "formik";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormContainer } from "../../components/layout/FormContainer";
import useNotification from "../../hooks/useNotification";
import * as yup from 'yup';
import { Report } from "../../types";


export const ReportCreateForm = (props: {
  onClose: (created: boolean) => void;
}) => {
  const navigate = useNavigate();
  const [ loading, setLoading ] = useState(false);
  const { sendNotification } = useNotification();
  const {
    onClose,
  } = props;

  const validationSchema = yup.object({});

  const formik = useFormik<Partial<Report>>({
    initialValues: {
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      console.log('TODO: Create the report')
      setLoading(false);
    },
  });


  return (
    <FormContainer
      form={formik}
      actions={<>
        <Button variant="contained" type="submit">Submit</Button>
      </>}
    >
    </FormContainer>
  )
}
