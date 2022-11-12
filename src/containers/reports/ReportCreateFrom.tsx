import {
  Button
} from "@mui/material"
import { useFormik } from "formik";
import { useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FormContainer } from "../../components/layout/FormContainer";
import useNotification from "../../hooks/useNotification";
import * as yup from 'yup';
import { createNotebook, Report } from "../../types";
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from "react-redux";
import { updateReport } from "../../slices";


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
  const dispatch = useDispatch();

  const formik = useFormik<Partial<Report>>({
    initialValues: {
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      const id = uuidv4();

      dispatch(updateReport({
        id,
        notebook: createNotebook('Untitled Report'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        namespaces: [],
      }))

      sendNotification({
        message: "Report created",
        variant: "success"
      })
      onClose(true);
      setLoading(false);

      await navigate(`/report/${id}`);
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
